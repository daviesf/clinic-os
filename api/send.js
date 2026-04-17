const TOKEN =
  "EAAhnZAGJMmoQBRGpPbUPz4vr36tkt05oiQcKWfTQ6KuIZBF7DhF6W88EnYsOM25eJgCQz6jpHf4YOt3M1XMwhm3k3Uk0kUYIq7is0L4NaMa5IxWthnhtuE4ncWGjM5nnIVFBFfsbjzB0pYDgVeuh7ldOVKCn1llkWINZAsZA8AfwdGp3fSdqgO3Xbz5x9ASQt6gnZAM5lNX1MvQsjQ6K7C7PuSVthsIA2A1MvwJPdQHbrpyrnhsRXj3fl5SSyLA4HzVZALEAIfCuU8FqahKN8tZAXgX";
const PHONE_NUMBER_ID = "1139336862576856";
const TO = "5519982686748";

async function sendMessage() {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: TO,
          type: "text",
          text: {
            body: "oi",
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.log("❌ ERRO:");
      console.log(data);
      return;
    }

    console.log("✅ SUCESSO:");
    console.log(data);
  } catch (error) {
    console.log("❌ ERRO GERAL:");
    console.log(error.message);
  }
}

sendMessage();
