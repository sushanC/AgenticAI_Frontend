import axios from "axios";

export default function VoiceButton() {

  async function startVoice() {

    try {

      const response =
        await axios.post(
          "http://localhost:3001/voice"
        );

      console.log(
        response.data
      );

    } catch (err) {

      console.error(err);
    }
  }

  return (

    <button
      onClick={startVoice}
      style={{
        padding: "10px"
      }}
    >
      🎤 Voice
    </button>

  );
}