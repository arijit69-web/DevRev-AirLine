/* 
Using Sequelize, create a Migration File to make DB level changes and add constraints
To create this file run the below command in the terminal 
inside the /src directory

`npx sequelize migration:generate --name update-city-airport-association`

In order to actually make changes to the table/model inside the DB.

Inside the terminal, inside the `/src` folder write the following command:

`npx sequelize db:migrate`
*/
"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint("Airports", {
      // Adding a FOREIGN KEY constraint to the table Airports
      type: "FOREIGN KEY",
      name: "city_fkey_constraint",
      fields: ["cityId"],
      references: {
        table: "Cities",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove a constraint from a table
    await queryInterface.removeConstraint("Airports", "city_fkey_constraint");
  },
};

/*
MySQL Query to check if constraint has been applied or not :
select * from INFORMATION_SCHEMA.KEY_COLUMN_USAGE where TABLE_NAME = 'airports' AND CONSTRAINT_SCHEMA = 'flights';
*/
