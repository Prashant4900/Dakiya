# Users Endpoint

## List Users
Returns the in-memory user list from `@example/server`.

## Get User
Fetch one user by id (`userId` from the active environment).

## Create User
Creates a user. Requires `firstName`, `lastName`, and `email`. Expects `201`.

## Update User
Partial update of an existing user by `userId`.

## Delete User
Deletes a user by `userId`. Expects `204` with empty body.
