require("dotenv").config();

const App = require("./Src/App");
const connectDb = require("./Src/config/db");

const PORT = process.env.PORT || 3000;

connectDb();

App.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});