require("dotenv").config();

const App = require("./Src/App");
const connectDb = require("./Src/config/db");

connectDb();

const PORT = process.env.PORT || 3000;

App.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});