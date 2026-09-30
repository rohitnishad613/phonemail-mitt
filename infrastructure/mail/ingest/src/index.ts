import { SMTPServer } from 'smtp-server';

const PORT = Number(process.env.PORT ?? 2525);
const API_BASE_URL = process.env.API_BASE_URL;
const INGEST_SECRET = process.env.MAIL_INGEST_SECRET;

if (!INGEST_SECRET) throw new Error('MAIL_INGEST_SECRET is required');
if (!API_BASE_URL) throw new Error('API_BASE_URL is required');

const MAX_MESSAGE_SIZE = Number(process.env.MAX_MESSAGE_SIZE ?? 25 * 1024 * 1024);

const server = new SMTPServer({
  secure: false,
  disabledCommands: ['AUTH'],
  size: MAX_MESSAGE_SIZE, // Tells underlying library to enforce SIZE command limits
  authOptional: true,

  onConnect(session, callback) {
    callback();
  },
  onMailFrom(address, session, callback) {
    callback();
  },
  onRcptTo(address, session, callback) {
    callback();
  },

  onData(stream, session, callback) {
    const chunks: Buffer[] = [];
    let total = 0;
    let isOverSize = false;

    // 1. Traditional event-driven approach ensures stream handles backpressure cleanly
    stream.on('data', (chunk: Buffer) => {
      if (isOverSize) return;

      total += chunk.length;

      if (total > MAX_MESSAGE_SIZE) {
        isOverSize = true;
        // Terminate the incoming stream completely so memory isn't leaked
        stream.destroy(new Error('Message too large'));
        return callback(new Error('Message too large'));
      }

      chunks.push(chunk);
    });

    // 2. Stream finished gathering data successfully
    stream.on('end', async () => {
      if (isOverSize) return;

      try {
        const message = Buffer.concat(chunks);

        // Forward the email payload as a raw binary buffer to your NestJS backend
        const response = await fetch(
          `${API_BASE_URL}/api/v1/internal/mail/ingest`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/octet-stream',
              'x-mail-ingest-secret': INGEST_SECRET,
              'content-length': message.length.toString(),
            },
            body: message, // Node fetch natively supports passing buffers as body
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`API rejected mail: ${response.status} ${text}`);
        }

        // Inform the SMTP server that ingestion succeeded (sends 250 OK back to Postfix)
        callback();
      } catch (error) {
        callback(
          error instanceof Error ? error : new Error('Mail ingestion failed')
        );
      }
    });

    // 3. Handle arbitrary stream socket closures or parsing faults safely
    stream.on('error', (err) => {
      if (!isOverSize) {
        callback(err);
      }
    });
  },
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mail ingest SMTP listening on ${PORT}`);
});
