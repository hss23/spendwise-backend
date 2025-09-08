import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ClientProxy } from '@nestjs/microservices';
import { Notification, NotificationDocument, NotificationType, NotificationPriority } from './schemas/notification.schema';
import { CreateNotificationDto, UpdateNotificationDto, NotificationFiltersDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientProxy,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel({
      ...createDto,
      user: new Types.ObjectId(createDto.userId),
      scheduledAt: createDto.scheduledAt ? new Date(createDto.scheduledAt) : new Date(),
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : undefined,
    });

    const savedNotification = await notification.save();

    // Send to Kafka for real-time notifications
    try {
      this.kafkaClient.emit('notification.created', {
        userId: createDto.userId,
        notification: savedNotification,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to emit notification to Kafka:', error);
    }

    // Clear user's notifications cache
    await this.cacheManager.del(`notifications-${createDto.userId}`);

    return savedNotification;
  }

  async findAll(userId: string, filters?: NotificationFiltersDto): Promise<Notification[]> {
    const cacheKey = `notifications-${userId}-${JSON.stringify(filters || {})}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached as Notification[];
    }

    const query: any = {
      user: new Types.ObjectId(userId),
      isActive: true,
      scheduledAt: { $lte: new Date() },
    };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.isRead !== undefined) {
      query.isRead = filters.isRead;
    }

    if (filters?.priority) {
      query.priority = filters.priority;
    }

    if (filters?.fromDate || filters?.toDate) {
      query.createdAt = {};
      if (filters.fromDate) {
        query.createdAt.$gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        query.createdAt.$lte = new Date(filters.toDate);
      }
    }

    const notifications = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1, priority: -1 })
      .limit(100)
      .exec();

    await this.cacheManager.set(cacheKey, notifications, 300); // 5 minutes cache
    return notifications;
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel
      .findOne({ _id: id, user: new Types.ObjectId(userId) })
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async update(id: string, updateDto: UpdateNotificationDto, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    // Clear cache
    await this.cacheManager.del(`notifications-${userId}`);

    return updatedNotification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.update(id, { isRead: true }, userId);
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel
      .updateMany(
        { user: new Types.ObjectId(userId), isRead: false },
        { isRead: true }
      )
      .exec();

    // Clear cache
    await this.cacheManager.del(`notifications-${userId}`);

    return { modifiedCount: result.modifiedCount };
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    
    await this.notificationModel
      .findByIdAndUpdate(id, { isActive: false })
      .exec();

    // Clear cache
    await this.cacheManager.del(`notifications-${userId}`);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `unread-count-${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached !== null && cached !== undefined) {
      return cached as number;
    }

    const count = await this.notificationModel
      .countDocuments({
        user: new Types.ObjectId(userId),
        isRead: false,
        isActive: true,
        scheduledAt: { $lte: new Date() },
      })
      .exec();

    await this.cacheManager.set(cacheKey, count, 60); // 1 minute cache
    return count;
  }

  async createBudgetAlert(userId: string, categoryName: string, spent: number, budget: number, type: 'warning' | 'exceeded'): Promise<Notification> {
    const percentage = Math.round((spent / budget) * 100);
    const isExceeded = type === 'exceeded';
    
    return this.create({
      userId,
      type: isExceeded ? NotificationType.BUDGET_EXCEEDED : NotificationType.BUDGET_WARNING,
      title: isExceeded ? 'Budget Exceeded!' : 'Budget Warning',
      message: isExceeded 
        ? `You've exceeded your ${categoryName} budget by ${percentage - 100}%`
        : `You've spent ${percentage}% of your ${categoryName} budget`,
      priority: isExceeded ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      metadata: { categoryName, spent, budget, percentage },
    });
  }

  async createGoalAlert(userId: string, goalName: string, progress: number, target: number, achieved = false): Promise<Notification> {
    const percentage = Math.round((progress / target) * 100);
    
    return this.create({
      userId,
      type: achieved ? NotificationType.GOAL_ACHIEVED : NotificationType.GOAL_PROGRESS,
      title: achieved ? 'Goal Achieved! 🎉' : 'Goal Progress Update',
      message: achieved 
        ? `Congratulations! You've achieved your ${goalName} goal!`
        : `You're ${percentage}% towards your ${goalName} goal`,
      priority: achieved ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      metadata: { goalName, progress, target, percentage },
    });
  }

  async cleanupExpiredNotifications(): Promise<void> {
    const result = await this.notificationModel
      .deleteMany({
        expiresAt: { $lt: new Date() },
        isActive: false,
      })
      .exec();

    console.log(`Cleaned up ${result.deletedCount} expired notifications`);
  }
}
