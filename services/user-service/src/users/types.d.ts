import { User } from 'generated/prisma';

export type PublicUser = Omit<User, 'password'>;

interface FindUserResponse {
  user: PublicUser | null;
}

interface CreateSignInUserResponse {
  user: PublicUser;
  token: string;
}

// interface UserJwtPayload {
//   user: {
//     id: string;
//     role: Role;
//   };
//   token: string;
// }
