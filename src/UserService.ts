import {Component} from '@nestjs/common';
import {User} from 'platform-domain';
import * as bcrypt from 'bcrypt/bcrypt';
import {isNullOrUndefined} from 'util';

@Component()
export class UserService {

    rootUser: User;
    defaultUser: User;

    users: User[];

    constructor() {
        const salt = bcrypt.genSaltSync(10);
        this.rootUser = new User('rootId', 'customerId', 'root', 'root@email.com',
            bcrypt.hashSync('root', salt), ['ROLE_ROOT']);
        this.defaultUser = new User('userId', 'customerId', 'username', 'username@email.com',
            bcrypt.hashSync('username', salt), ['ROLE_ADMIN']);
        this.users = [this.rootUser, this.defaultUser];
    }

    async findByUsernameAndPassword(username: string, password: string): Promise<User> {
        const foundUser = this.users.find(user => user.email === username);
        if (!isNullOrUndefined(foundUser)) {
            const match = await bcrypt.compare(password, foundUser.passwordHash);
            if (match) return foundUser;
        }
        return null;
    }

    async findById(id: string): Promise<User> {
        return new Promise<User>(((resolve, reject) => resolve(this.users.find(user => user.id === id))));
    }

    async findByEmail(email: string): Promise<User> {
        return new Promise<User>(((resolve, reject) => resolve(this.users.find(user => user.email === email))));
    }
}