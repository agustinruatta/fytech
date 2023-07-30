import { User } from '../../../../src/Users/Entities/User';
import { InvalidArgumentException } from '../../../../src/Shared/Exceptions/InvalidArgumentException';

describe('User', () => {
  describe('constructor', () => {
    const user = new User('test@gmail.com', 'password');

    it('set email correctly', () => {
      expect(user.getEmail()).toBe('test@gmail.com');
    });

    it('must save a hashed password', () => {
      expect(user['hashedPassword']).not.toBe('password');
      expect(typeof user['hashedPassword']).toBe('string');
    });
  });

  describe('isValidPassword', () => {
    it('is a valid password', () => {
      const user = new User('test@gmail.com', 'password');

      expect(user.isValidPassword('password')).toBe(true);
    });

    it('is not a valid password', () => {
      const user = new User('test@gmail.com', 'password');

      expect(user.isValidPassword('invalid')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('throws an exception if email is invalid', () => {
      expect(() => new User('invalid', 'password')).toThrow(
        new InvalidArgumentException('Invalid email'),
      );
    });
  });

  describe('serialize', () => {
    it('serializes an user object', () => {
      const user = new User('test@gmail.com', 'password');

      expect(user.serialize()).toStrictEqual({ email: 'test@gmail.com' });
    });
  });
});
