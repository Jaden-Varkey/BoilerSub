import { supabaseAnonClient } from "../config/supabase";
import { SupabaseListingRepository } from "../repositories/supabase.listing.repository";
import { SupabaseUserRepository } from "../repositories/supabase.user.repository";
import { AuthService } from "../services/auth.service";
import { ListingsService } from "../services/listings.service";
import { UsersService } from "../services/users.service";

export const userRepository = new SupabaseUserRepository();
export const listingRepository = new SupabaseListingRepository();
export const authService = new AuthService(userRepository);
export const usersService = new UsersService(userRepository);
export const listingsService = new ListingsService(listingRepository, userRepository);

export const authDependencies = {
  supabase: supabaseAnonClient,
  userRepository,
} as const;
