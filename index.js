const app = require('./myapp')
const port = 5000; 
let server ;
const serverport=()=>{
  server= app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
}
serverport()


