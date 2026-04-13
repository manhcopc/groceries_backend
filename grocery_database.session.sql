ALTER TABLE users
MODIFY avatar_url VARCHAR(500);INSERT INTO products (
    id,
    name,
    price,
    stock_quantity,
    category_id,
    description,
    created_at,
    updated_at,
    image_url
  )
VALUES (
    id:intINSERT INTO users (
        id,
        username,
        password_hash,
        role,
        created_at,
        updated_at,
        avatar_url
      )
    VALUES (
        id:int,
        'username:varchar',
        'password_hash:varchar',
        'role:enum',
        'created_at:timestamp',
        'updated_at:timestamp',
        'avatar_url:varchar'
      );,
    'name:varchar',
    'price:decimal',
    stock_quantity:int,
    category_id:int,
    'description:text',
    'created_at:timestamp',
    'updated_at:timestamp',
    'image_url:varchar'
  );