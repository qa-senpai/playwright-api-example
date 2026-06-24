import test, { APIRequestContext, APIResponse, expect } from '@playwright/test';

// create a new product POST
async function createProduct(
  request: APIRequestContext,
  newProduct: any,
  options = {
    failOnStatusCode: true,
  },
): Promise<APIResponse> {
  const response = await request.post('/api/v1/products/', {
    data: newProduct,
    failOnStatusCode: options.failOnStatusCode,
  });

  return response;
}

// prepare a random test data
const randomNumber = Math.floor(Math.random() * 10000);

const newProduct = {
  title: `Hogwarts castle LEGO #${randomNumber}`,
  //   price: 10,
  description: `A description for Hogwarts castle LEGO #${randomNumber}`,
  categoryId: 1,
  images: ['https://placehold.co/600x400'],
};

test('test', async ({ request }) => {
  const response = await createProduct(request, newProduct, {
    failOnStatusCode: false,
  });

  const json = await response.json();
  const text = await response.text();

  expect(text).toContain(
    '{"message":["price should not be empty","price must be a positive number"],"error":"Bad Request","statusCode":400}',
  );

  expect(response.status()).toBe(400);
  expect(json).toMatchObject({
    message: ['price should not be empty', 'price must be a positive number'],
    error: 'Bad Request',
    statusCode: 400,
  });
});
