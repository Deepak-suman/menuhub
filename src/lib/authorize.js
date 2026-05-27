import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Checks if the request is authorized based on session and roles.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route.
 * @returns {Promise<{user: object, restaurantId: string}|null>}
 */
export async function getAuthorizedUser(allowedRoles = []) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  const { role, restaurantId } = session.user;

  // If roles are specified, check if user's role is in the list
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return null;
  }

  // Super admins might not have a restaurantId in their session
  // They usually manage all restaurants.
  
  return {
    user: session.user,
    restaurantId: restaurantId,
    role: role
  };
}
