import { SupabaseListingRepository } from "../repositories/supabase.listing.repository";
import { SupabaseUserRepository } from "../repositories/supabase.user.repository";
import { AuthService } from "../services/auth.service";
import { ListingsService } from "../services/listings.service";
import { UsersService } from "../services/users.service";

const userRepository = new SupabaseUserRepository();
const listingRepository = new SupabaseListingRepository();

export const authService = new AuthService(userRepository);
export const usersService = new UsersService(userRepository);
export const listingsService = new ListingsService(listingRepository, userRepository);
export { listingRepository, userRepository };
