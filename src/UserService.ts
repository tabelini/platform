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
            bcrypt.hash('root', salt), ['ROLE_ROOT']);
        this.defaultUser = new User('userId', 'customerId', 'username', 'username@email.com',
            bcrypt.hash('username', salt), ['ROLE_ADMIN']);
        this.users = [this.rootUser, this.defaultUser];
    }

    async findByUsernameAndPassword(username: string, password: string): Promise<User> {
        const foundUser = this.users.find(user => user.username === username);
        if (!isNullOrUndefined(foundUser)) {
            const match = await bcrypt.compare(password, user.passwordHash);
            if (match) return foundUser;
        }
        return null;
    }
}