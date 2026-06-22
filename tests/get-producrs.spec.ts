import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// GET /products — отримання списку товарів
// ─────────────────────────────────────────────────────────────────────────────
test('get products - should be successful', async ({ request }) => {
  const response = await request.get('/api/v1/products', {
    // failOnStatusCode: true автоматично "впаде", якщо статус не 2xx/3xx.
    // Зручно як запобіжник, але тоді перевірки статусу нижче частково дублюють
    // цю поведінку. Залиш щось одне, щоб не плутати читача тесту.
    failOnStatusCode: true,
  });

  // toBeOK() — найкоротша перевірка "успішності": true для будь-якого статусу 200-299.
  // РЕКОМЕНДАЦІЯ: використовуй її, коли важливий лише факт успіху, а не конкретний код.
  expect(response).toBeOK();

  // Якщо ж потрібен саме конкретний код — перевіряй точне значення.
  // toBeOK() і toBe(200) разом надлишкові: достатньо одного з них.
  expect(response.status()).toBe(200);
  expect(response.statusText()).toBe('OK');

  // РЕКОМЕНДАЦІЇ, що ще варто перевірити для GET-списку:
  // 1) Тіло — масив:           expect(Array.isArray(body)).toBe(true);
  // 2) Список не порожній:      expect(body.length).toBeGreaterThan(0);
  // 3) Структура елемента:      expect(body[0]).toHaveProperty('id');
  // 4) Заголовок Content-Type:  expect(response.headers()['content-type']).toContain('application/json');
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /products з пагінацією (offset/limit)
// ─────────────────────────────────────────────────────────────────────────────
test('test', async ({ request }) => {
  // РЕКОМЕНДАЦІЯ: давай тесту змістовну назву, напр.
  // 'get products with pagination - should return limited list'.

  // Arrange
  // Act
  const response = await request.get('/api/v1/products', {
    params: {
      offset: 0,
      limit: 10,
    },
  });

  // Assert
  expect(response.status()).toBe(200);

  // РЕКОМЕНДАЦІЯ: суть пагінації — кількість елементів. Її і треба перевіряти:
  //   const body = await response.json();
  //   expect(body.length).toBeLessThanOrEqual(10);   // не більше за limit
  //   expect(body).toHaveLength(10);                  // якщо точно очікуєш 10
  // Для перевірки offset порівняй перші id двох запитів з різним offset.
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /products — створення товару (+ перевірка через GET)
// ─────────────────────────────────────────────────────────────────────────────
test('create products - should be successful', async ({ request }) => {
  // Arrange
  // Унікальний title уникає колізій між прогонами тестів. Це хороша практика.
  const randomNum = Math.floor(Math.random() * 1_000_000);
  const uniqueTitle = `New Product` + randomNum;

  // Act
  const responseCreate = await request.post('/api/v1/products/', {
    data: {
      title: uniqueTitle,
      price: 10,
      description: 'A description',
      categoryId: 1,
      images: ['https://placehold.co/600x400'],
    },
    failOnStatusCode: true,
  });

  // Assert
  // РЕКОМЕНДАЦІЯ: перевір статус саме створення — для POST очікується 201 Created:
  //   expect(responseCreate.status()).toBe(201);
  let jsonCreate = await responseCreate.json();
  const productId = jsonCreate['id'];

  // РЕКОМЕНДАЦІЯ: переконайся, що сервер повернув id, перш ніж використовувати його:
  //   expect(productId).toBeTruthy();
  //   expect(typeof productId).toBe('number');

  const responseGet = await request.get(`/api/v1/products/${productId}`, {
    failOnStatusCode: true,
  });

  const jsonGet = await responseGet.json();

  // toHaveProperty(key, value) — ідеальна перевірка для відповіді API:
  // одночасно перевіряє і наявність поля, і його значення.
  expect(jsonGet).toHaveProperty('title', uniqueTitle);
  expect(jsonGet).toHaveProperty('price', 10);
  expect(jsonGet).toHaveProperty('description', 'A description');
  expect(jsonGet).toHaveProperty('images', ['https://placehold.co/600x400']);
  // Вкладене поле через крапку — зручно для перевірки об'єктів усередині відповіді.
  expect(jsonGet).toHaveProperty('category.id', 1);

  // АЛЬТЕРНАТИВА: коли полів багато, замість десятка toHaveProperty можна
  // перевірити частковий збіг об'єкта одним рядком:
  //   expect(jsonGet).toMatchObject({ title: uniqueTitle, price: 10 });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /products/:id — оновлення товару
// ─────────────────────────────────────────────────────────────────────────────
test('update product - should be successful', async ({ request }) => {
  const randomNum = Math.floor(Math.random() * 1_000_000);
  const uniqueTitle = `New Product` + randomNum;

  const response = await request.post('/api/v1/products/', {
    data: {
      title: uniqueTitle,
      price: 10,
      description: 'A description',
      categoryId: 1,
      images: ['https://placehold.co/600x400'],
    },
    failOnStatusCode: true,
  });

  const json = await response.json();
  const productId = json['id'];

  const responseUpdate = await request.put(`/api/v1/products/${productId}`, {
    data: {
      title: 'New Product',
      slug: 'new-product-123',
      price: 10,
      description: 'A description',
      categoryId: 1,
      images: ['https://placehold.co/600x400'],
    },
  });

  // ⚠️ ЗАРАЗ ТЕСТ НІЧОГО НЕ ПЕРЕВІРЯЄ — він пройде, навіть якщо оновлення впало.
  // РЕКОМЕНДАЦІЇ, які перевірки додати після PUT:
  //   1) Статус оновлення:        expect(responseUpdate.ok()).toBeTruthy();
  //   2) Відповідь містить нові значення:
  //        const updated = await responseUpdate.json();
  //        expect(updated).toHaveProperty('title', 'New Product');
  //        expect(updated).toHaveProperty('price', 20);   // якщо змінюєш ціну
  //   3) Найнадійніше — окремий GET і перевірка, що зміни справді збереглися:
  //        const check = await request.get(`/api/v1/products/${productId}`);
  //        expect((await check.json())).toHaveProperty('title', 'New Product');
  void responseUpdate;
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /products/:id — видалення товару
// ─────────────────────────────────────────────────────────────────────────────
test('delete product - should be successful', async ({ request }) => {
  const randomNum = Math.floor(Math.random() * 1_000_000);
  const uniqueTitle = `New Product` + randomNum;

  // Тут заданий повний URL, а в інших тестах — відносний шлях.
  // РЕКОМЕНДАЦІЯ: винеси baseURL у playwright.config.ts (use.baseURL) і всюди
  // використовуй відносні шляхи — тести стануть переноснішими між середовищами.
  let response = await request.post(
    'https://api.escuelajs.co/api/v1/products/',
    {
      data: {
        title: uniqueTitle,
        price: 10,
        description: 'A description',
        categoryId: 1,
        images: ['https://placehold.co/600x400'],
      },
      failOnStatusCode: true,
    },
  );

  const json = await response.json();
  const productId = json['id'];

  const responseDelete = await request.delete(
    `https://api.escuelajs.co/api/v1/products/${productId}`,
  );

  // РЕКОМЕНДАЦІЯ: спершу переконайся, що саме видалення успішне.
  // Цей API повертає true в тілі відповіді:
  //   expect(responseDelete.ok()).toBeTruthy();
  //   expect(await responseDelete.json()).toBe(true);
  void responseDelete;

  response = await request.get(
    `https://api.escuelajs.co/api/v1/products/${productId}`,
  );

  // Перевірка "негативного" сценарію: після видалення товар недоступний.
  // РЕКОМЕНДАЦІЯ: семантично коректнішим для "не знайдено" є 404, а не 400 —
  // звір очікуваний код із реальною поведінкою API:
  //   expect(response.status()).toBe(404);
  expect(response.status()).toBe(400);
});
