import axios from "axios";
axios.get("http://localhost:3000/api/health").then(res => console.log(res.data)).catch(err => console.error(err.message));
