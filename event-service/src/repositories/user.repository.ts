import { getD1Client } from "../config/d1.config";

const client = getD1Client();

interface User {
  userId: string;
  email: string;
  username: string;
  name: string;
  gender: string;
  image: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export const userRepository = {
  async addNewUser(user: User) {
    try {
      const sql = `INSERT INTO users (id, email, username, name, gender, image, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) `;

      const result = await client.query(sql, [
        user.userId,
        user.email,
        user.username,
        user.name,
        user.gender,
        user.image,
        user.role,
        user.createdAt,
        user.updatedAt,
      ]);

      return result;
    } catch (error) {
      console.error("Failed to add new user:", error);
      throw error;
    }
  },

  async findByUserIds(
    // userIds: string[],
    id: string,
    search?: string
    // includeAlwaysUserId?: string
  ) {
    try {
      let sql = `SELECT u.id as userId, u.name, u.username, u.gender, u.image, 'ORGANIZER' AS eventRole FROM users AS u JOIN events e ON e.organizer_id = u.id WHERE e.id = ? UNION SELECT u.id as userId, u.name, u.username, u.gender, u.image, 'ATTENDEE' AS eventRole FROM users AS u JOIN event_registrations er ON er.user_id = u.id WHERE er.event_id = ? AND LOWER(u.name) LIKE ? LIMIT 10`;
      const result = await client.query(sql, [
        id,
        id,
        `%${search?.toLowerCase()}%`,
      ]);
      if (!result.results) {
        return [];
      }
      return result.results;
    } catch (error) {
      console.error("Failed to find users by IDs:", error);
      throw error;
    }
  },
};
