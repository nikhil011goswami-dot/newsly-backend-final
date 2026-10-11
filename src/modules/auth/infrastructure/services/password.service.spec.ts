import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('should hash a password', async () => {
    const hash = await service.hash('NewslyTest@123');

    expect(hash).toBeTruthy();
    expect(hash).not.toBe('NewslyTest@123');
  });

  it('should verify the correct password', async () => {
    const password = 'NewslyTest@123';
    const hash = await service.hash(password);

    await expect(service.verify(hash, password)).resolves.toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await service.hash('NewslyTest@123');

    await expect(
      service.verify(hash, 'WrongPassword@123'),
    ).resolves.toBe(false);
  });

  it('should generate different hashes for the same password', async () => {
    const password = 'NewslyTest@123';

    const firstHash = await service.hash(password);
    const secondHash = await service.hash(password);

    expect(firstHash).not.toBe(secondHash);
  });
});
