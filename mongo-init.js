db.createUser({
  user: 'shoyu',
  pwd: 'ff3727276784ada',
  roles: [
    {
      role: 'readWrite',
      db: 'dev',
    },
  ],
});
