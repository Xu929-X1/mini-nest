import { Injectable } from "../../../decorators/Injectable";
import { HttpClient } from "../../../http/client/httpClient";


const API_BASE = 'https://jsonplaceholder.typicode.com';

export interface User {
    id: number;
    name: string;
    email: string;
    username: string;
}

export interface Post {
    id: number;
    title: string;
    body: string;
    userId: number;
}

@Injectable()
export class UserService {
    constructor(private http: HttpClient) { }

    async getUser(id: string): Promise<User> {
        const res = await this.http.get<User>(`${API_BASE}/users/${id}`);
        return res.data;
    }

    async getUserPosts(userId: string): Promise<Post[]> {
        const res = await this.http.get<Post[]>(`${API_BASE}/posts`, {
            params: { userId },
        });
        return res.data;
    }

    async getUserProfile(id: string) {
        const [user, posts] = await Promise.all([
            this.getUser(id),
            this.getUserPosts(id),
        ]);
        return { user, posts };
    }

    async createUser(data: Partial<User>): Promise<User> {
        const res = await this.http.post<User>(`${API_BASE}/users`, data);
        return res.data;
    }
}