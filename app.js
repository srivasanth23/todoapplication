const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db;

const Connection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server started");
    });
  } catch (error) {
    console.log(`Error Message: ${error.message}`);
    process.exit(1);
  }
};

Connection();

const checkRequestQueries = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  const { todoId } = request.params;

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const inCategoryArray = categoryArray.includes(category);

    if (inCategoryArray) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );

      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

const checkRequestBody = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const inCategoryArray = categoryArray.includes(category);
    if (inCategoryArray) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(new Date(formatedDate));
      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

app.get("/todos/", checkRequestQueries, async (request, response) => {
  const {
    status = "",
    search_q = "",
    priority = "",
    category = "",
  } = request.query;
  const Query = `SELECT id, todo, priority, status, category,
  due_date AS dueDate
   FROM todo WHERE
        todo LIKE '%${search_q}%'
        AND priority LIKE '%${priority}%' 
        AND status LIKE '%${status}%' 
        AND category LIKE '%${category}%';`;

  const dbResponse = await db.all(Query);
  response.send(dbResponse);
});

app.get("/todos/:todoId", checkRequestQueries, async (request, response) => {
  const { todoId } = request.params;

  const Query = `SELECT id, todo, priority, status, category,
  due_date AS dueDate
   FROM todo WHERE id = ${todoId}`;

  const dbResponse = await db.get(Query);
  response.send(dbResponse);
});


app.get("/agenda/", checkRequestQueries, async (request, response) => {
  const { date } = request.query;

  if (date !== undefined) {
    const isValidDate = isValid(new Date(date));
    if (isValidDate) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const Query3 = `select id, todo, priority, status, category,
  due_date AS dueDate from todo where due_date = '${formattedDate}';`;
      const todos = await db.all(Query3);
      response.send(todos);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos", checkRequestBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const Query = `INSERT INTO todo (id, todo, category, priority, status, due_date)
    VALUES (${id}, '${todo}', '${priority}','${status}','${category}', '${dueDate}');`;
  await db.run(Query);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", checkRequestBody, async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let Query = null;

  switch (true) {
    case status !== undefined:
      Query = `UPDATE todo SET status = '${status}'
            WHERE 
                id = ${todoId} ;`;
      await db.run(Query);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      const updateCategoryQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateCategoryQuery);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      const updateDateQuery = `
            UPDATE
                todo
            SET 
                due_date = '${dueDate}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateDateQuery);
      response.send("Due Date Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
            DELETE FROM 
                todo
            WHERE 
               id=${todoId}
     ;`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
