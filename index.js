const app = require('./myapp')
const port =process.env.PORT|| 5000; 
let server ;
const serverport=()=>{
  server= app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
}
serverport()


