export interface AuthUser {
  id: string;
  githubId: string;
  username: string;
  avatarUrl: string;
  email?: string;
}

export interface JwtPayload {
  userId: string;
  githubId: string;
}
