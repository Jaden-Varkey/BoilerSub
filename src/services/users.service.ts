import { ApiError } from "../lib/apiError.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { PublicUser, UserRecord } from "../types/index.js";

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    full_name: user.full_name,
    bio: user.bio,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserById(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, "user_not_found", "User not found");
    }
    return toPublicUser(user);
  }

  async updateMe(userId: string, input: { full_name?: string | null; bio?: string | null }): Promise<PublicUser> {
    const user = await this.userRepository.updateProfile(userId, input);
    return toPublicUser(user);
  }
}
