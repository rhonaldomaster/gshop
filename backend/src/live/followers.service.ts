import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StreamerFollow } from '../database/entities/streamer-follow.entity';
import { User } from '../database/entities/user.entity';
import { DeviceToken } from '../notifications/device-token.entity';

export interface FollowerStats {
  followersCount: number;
  followingCount: number;
}

export interface FollowerInfo {
  id: string;
  name: string;
  avatar?: string;
  followedAt: Date;
}

@Injectable()
export class FollowersService {
  constructor(
    @InjectRepository(StreamerFollow)
    private readonly followRepository: Repository<StreamerFollow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepository: Repository<DeviceToken>,
  ) {}

  /**
   * Follow a streamer
   */
  async followStreamer(followerId: string, streamerId: string): Promise<StreamerFollow> {
    if (followerId === streamerId) {
      throw new ConflictException('Cannot follow yourself');
    }

    // Check if streamer exists
    const streamer = await this.userRepository.findOne({ where: { id: streamerId } });
    if (!streamer) {
      throw new NotFoundException('Streamer not found');
    }

    // Check if already following
    const existingFollow = await this.followRepository.findOne({
      where: { followerId, streamerId },
    });

    if (existingFollow) {
      throw new ConflictException('Already following this streamer');
    }

    const follow = this.followRepository.create({
      followerId,
      streamerId,
      notificationsEnabled: true,
    });

    return this.followRepository.save(follow);
  }

  /**
   * Unfollow a streamer
   */
  async unfollowStreamer(followerId: string, streamerId: string): Promise<void> {
    const follow = await this.followRepository.findOne({
      where: { followerId, streamerId },
    });

    if (!follow) {
      throw new NotFoundException('Not following this streamer');
    }

    await this.followRepository.remove(follow);
  }

  /**
   * Check if user is following a streamer
   */
  async isFollowing(followerId: string, streamerId: string): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: { followerId, streamerId },
    });
    return !!follow;
  }

  /**
   * Toggle notifications for a followed streamer
   */
  async toggleNotifications(
    followerId: string,
    streamerId: string,
    enabled: boolean,
  ): Promise<StreamerFollow> {
    const follow = await this.followRepository.findOne({
      where: { followerId, streamerId },
    });

    if (!follow) {
      throw new NotFoundException('Not following this streamer');
    }

    follow.notificationsEnabled = enabled;
    return this.followRepository.save(follow);
  }

  /**
   * Get followers of a streamer
   */
  async getFollowers(
    streamerId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ followers: FollowerInfo[]; total: number }> {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { streamerId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const followers: FollowerInfo[] = follows.map((f) => ({
      id: f.follower.id,
      name: `${f.follower.firstName} ${f.follower.lastName}`.trim() || f.follower.email.split('@')[0],
      avatar: f.follower.avatar,
      followedAt: f.createdAt,
    }));

    return { followers, total };
  }

  /**
   * Get streamers a user is following
   */
  async getFollowing(
    followerId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ following: FollowerInfo[]; total: number }> {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { followerId },
      relations: ['streamer'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const following: FollowerInfo[] = follows.map((f) => ({
      id: f.streamer.id,
      name: `${f.streamer.firstName} ${f.streamer.lastName}`.trim() || f.streamer.email.split('@')[0],
      avatar: f.streamer.avatar,
      followedAt: f.createdAt,
    }));

    return { following, total };
  }

  /**
   * Get follower/following stats for a user
   */
  async getStats(userId: string): Promise<FollowerStats> {
    const [followersCount, followingCount] = await Promise.all([
      this.followRepository.count({ where: { streamerId: userId } }),
      this.followRepository.count({ where: { followerId: userId } }),
    ]);

    return { followersCount, followingCount };
  }

  /**
   * Get follower count for a streamer
   */
  async getFollowerCount(streamerId: string): Promise<number> {
    return this.followRepository.count({ where: { streamerId } });
  }

  /**
   * Get device tokens of followers who have notifications enabled
   * Used for sending push notifications when streamer goes live
   */
  async getFollowerDeviceTokens(streamerId: string): Promise<string[]> {
    // Get followers with notifications enabled
    const follows = await this.followRepository.find({
      where: { streamerId, notificationsEnabled: true },
      select: ['followerId'],
    });

    if (follows.length === 0) {
      return [];
    }

    const followerIds = follows.map((f) => f.followerId);

    // Get active device tokens for these followers
    const deviceTokens = await this.deviceTokenRepository
      .createQueryBuilder('dt')
      .select('dt.token')
      .where('dt.userId IN (:...followerIds)', { followerIds })
      .andWhere('dt.isActive = :isActive', { isActive: true })
      .getMany();

    return deviceTokens.map((dt) => dt.token);
  }

  /**
   * Get follower IDs who have notifications enabled
   */
  async getFollowerIds(streamerId: string, withNotifications = true): Promise<string[]> {
    const where: any = { streamerId };
    if (withNotifications) {
      where.notificationsEnabled = true;
    }

    const follows = await this.followRepository.find({
      where,
      select: ['followerId'],
    });

    return follows.map((f) => f.followerId);
  }
}
