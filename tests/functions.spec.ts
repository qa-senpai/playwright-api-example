import { test, expect } from '@playwright/test';

// get product

function getRandomNumber() {
  return Math.floor(Math.random() * 1_000_000);
}

test('get products - should be successful', async ({ request }) => {
  const response = await request.get('/api/v1/products', {
    failOnStatusCode: true,
  });

  expect(response.status()).toBe(200);
  expect(response.statusText()).toBe('OK');
});

// create new product
test('create products - should be successful', async ({ request }) => {
  const uniqueTitle = 'new product ' + getRandomNumber();

  const responseCreate = await request.post('/api/v1/products', {
    data: {
      title: uniqueTitle,
      price: 100,
      description: 'A description',
      categoryId: 1,
      images: ['https://placeimg.com/640/480/any'],
    },
    failOnStatusCode: true,
  });

  let jsonCreate = await responseCreate.json();
  const productId = jsonCreate['id'];
  expect(productId).toBeTruthy();
  expect(typeof productId).toBe('number');

  const responseGet = await request.get(`/api/v1/products/${productId}`, {
    failOnStatusCode: true,
  });

  const jsonGet = await responseGet.json();
  expect(jsonGet).toHaveProperty('title', uniqueTitle);
  expect(jsonGet).toHaveProperty('price', 100);
  expect(jsonGet).toHaveProperty('description', 'A description');
  expect(jsonGet).toHaveProperty('images', [
    'https://placeimg.com/640/480/any',
  ]);
  // Вкладене поле через крапку — зручно для перевірки об'єктів усередині відповіді.
  expect(jsonGet).toHaveProperty('category.id', 1);
});

// update created products

test('update products - should be successful', async ({ request }) => {
  const uniqueTitle = 'new product ' + getRandomNumber();

  const response = await request.post('/api/v1/products', {
    data: {
      title: uniqueTitle,
      price: 101,
      description: 'A description',
      categoryId: 1,
      images: ['https://placeimg.com/640/480/any'],
    },
    failOnStatusCode: true,
  });
  const json = await response.json();
  const productId = json['id'];

  expect(productId).toBeTruthy();
  expect(typeof productId).toBe('number');

  const responseUpdate = await request.put(`/api/v1/products/${productId}`, {
    data: {
      title: 'My Product',
      price: 109,
      description: 'A description',
      categoryId: 1,
      images: ['https://placeimg.com/640/480/any'],
    },
  });

  expect(responseUpdate).toBeTruthy();

  const jsonUpdate = await responseUpdate.json();
  expect(jsonUpdate).toHaveProperty('title', 'My Product');
  expect(jsonUpdate).toHaveProperty('price', 109);
  void responseUpdate;
});

// delete created product
test('delete products - should be successful', async ({ request }) => {
  const randomNum = Math.floor(Math.random() * 1_000_000);
  const uniqueTitle = `New Product` + randomNum;

  let response = await request.post('/api/v1/products/', {
    data: {
      title: uniqueTitle,
      price: 10,
      description: 'A description',
      categoryId: 1,
      images: ['https://placeimg.com/640/480/any'],
    },
    failOnStatusCode: true,
  });

  const json = await response.json();
  const productId = json['id'];

  const responseDelete = await request.delete(
    `https://api.escuelajs.co/api/v1/products/${productId}`,
  );

  expect(responseDelete.ok()).toBeTruthy();
  expect(await responseDelete.json()).toBe(true);
  void responseDelete;

  response = await request.get(`/api/v1/products/${productId}`);

  expect(response.status()).toBe(400);
});

// filtered by categoryId

test('filtering products by categoryId - should be successful', async ({
  request,
}) => {
  const response = await request.get('/api/v1/products', {
    params: { categoryId: 1 },
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();

  for (const product of json) {
    expect(product.category.id).toBe(1);
  }
});

// filtering by price

test('filtering products by price - should be successful', async ({
  request,
}) => {
  const response = await request.get('/api/v1/products', {
    params: { price: 10 },
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();

  for (const product of json) {
    expect(product.price).toBe(10);
  }
});

// filtering by price between

test('filtering products by price between 10 and 100 - should be successful', async ({
  request,
}) => {
  const response = await request.get('/api/v1/products', {
    params: { price_min: 10, price_max: 100 },
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();

  for (const product of json) {
    expect(product.price).toBeGreaterThanOrEqual(10);
    expect(product.price).toBeLessThanOrEqual(100);
  }
});

// filtering by price and category

test('filtering products by price and category - should be successful', async ({
  request,
}) => {
  const response = await request.get('/api/v1/products', {
    params: { price: 10, categoryId: 1 },
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();

  for (const product of json) {
    expect(product.price).toBe(10);
    expect(product.category.id).toBe(1);
  }
});

// filtering by price between and category

test('filtering products by price between 10 and 100 and category - should be successful', async ({
  request,
}) => {
  const response = await request.get('/api/v1/products', {
    params: { price_min: 10, price_max: 100, categoryId: 1 },
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();

  for (const product of json) {
    expect(product.price).toBeGreaterThanOrEqual(10);
    expect(product.price).toBeLessThanOrEqual(100);
    expect(product.category.id).toBe(1);
  }
});

// filtering products by limit

test('filtering products limit 5 - should be successful', async ({
  request,
}) => {
  const response = await request.get('/api/v1/products', {
    params: { offset: 0, limit: 5 },
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.length).toBeLessThanOrEqual(5);
  //expect(json.length).toBe(5);
});
