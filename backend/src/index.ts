import env from './config/env.js';
import app from './server.js';

const port = Number(env.PORT);

app.listen(port, () => {
  console.log(`Attendance API listening on port ${port}`);
});
