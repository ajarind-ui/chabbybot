// Gantilah dengan API Key kamu yang valid
let GROQ_API_KEY = localStorage.getItem('groq_key') || "";
let HF_API_KEY = localStorage.getItem('hf_key') || "";

// Cek status key saat loading
updateKeyStatus();

function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.toggle('hidden');
    // Isi input dengan key yang sudah ada (jika ada)
    document.getElementById('groqInput').value = GROQ_API_KEY;
    document.getElementById('hfInput').value = HF_API_KEY;
}

function saveSettings() {
    const groqVal = document.getElementById('groqInput').value.trim();
    const hfVal = document.getElementById('hfInput').value.trim();

    if (groqVal && hfVal) {
        localStorage.setItem('groq_key', groqVal);
        localStorage.setItem('hf_key', hfVal);
        GROQ_API_KEY = groqVal;
        HF_API_KEY = hfVal;
        alert("Pengaturan Berhasil Disimpan! ✨");
        toggleSettings();
        updateKeyStatus();
    } else {
        alert("Mohon isi kedua API Key ya!");
    }
}

function updateKeyStatus() {
    const status = document.getElementById('apiKeyStatus');
    if (GROQ_API_KEY && HF_API_KEY) {
        status.innerText = "Aktif ✅";
        status.className = "text-green-500";
    } else {
        status.innerText = "Key Belum Set ❌";
        status.className = "text-red-500";
    }
}

// Di dalam fungsi sendMessage(), tambahkan proteksi:
async function sendMessage() {
    if (!GROQ_API_KEY || !HF_API_KEY) {
        alert("Atur API Key dulu di menu Setting (ikon ⚙️) ya!");
        toggleSettings();
        return;
    }   
}
// Fungsi Utama Pengirim Pesan
async function sendMessage() {
    const input = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    const message = input.value.trim();
    if (!message) return;

    // Tampilkan chat user
    chatBox.innerHTML += `<div class="ml-auto bg-cyan-700 p-3 rounded-lg max-w-[80%] text-sm text-right text-white shadow">${message}</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Logika Pintar: Cek apakah minta gambar
    if (message.toLowerCase().match(/(gambar|lukis|foto|tunjukkan|buatkan gambar)/)) {
        addReply("Tunggu ya sayang, aku lukiskan dulu buat kamu... 🎨", "ai");
        await generateImage(message);
    } else {
        await chatWithAI(message);
    }
}

// FUNGSI 1: Chat dengan Qwen 32B via Groq
async function chatWithAI(text) {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${GROQ_API_KEY}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                model: "qwen-2.5-32b", // Pakai model andalan Qwen
                messages: [
                    { 
                        role: "system", 
                        content: `Kamu adalah AI Companion tercanggih. Karaktermu: Asik, gaul, sedikit manja, usia 20 tahun ke atas (kalau user minta jadi teman diskusi tentang rumah tangga, cinta, dan hal yang tabu) tahun, sangat pintar (kalau user minta jadi teman belajar), dan pendengar yang baik (kalau user curhat). Gunakan bahasa Indonesia santai (Gue/Lo atau Aku/Kamu). Jangan kaku kayak robot pemerintah!` 
                    }, 
                    { role: "user", content: text }
                ],
                temperature: 0.9,
                max_tokens: 800
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            addReply(data.choices[0].message.content, "ai");
        } else {
            addReply("Duh, sinyal di otak aku lagi putus nyambung nih... coba lagi ya? 😅", "ai");
        }
    } catch (error) {
        console.error(error);
        addReply("Aduh, koneksi ke Groq bermasalah. Cek API Key atau internet kamu!", "ai");
    }
}

// FUNGSI 2: Generate Gambar via Hugging Face Router (Terbaru!)
async function generateImage(prompt) {
    try {
        // Panggil Router, dia otomatis pilih model Text-to-Image terbaik
        const response = await fetch("https://router.huggingface.co/t2i", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt + " --ar 16:9 --v 6.0", // Tambahkan modifier biar hasilnya cinematic
                parameters: {
                    guidance_scale: 7.5,
                    num_inference_steps: 30
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Gagal panggil Hugging Face Router");
        }

        const blob = await response.blob();
        const imgUrl = URL.createObjectURL(blob);
        
        // Tampilkan gambar dengan desain kartu yang rapi
        addReply(`
            <div class="mt-2 bg-gray-900 p-2 rounded-lg shadow-inner border border-gray-700">
                <p class="text-xs text-cyan-400 mb-1 font-mono">🎨 Prompt: ${prompt}</p>
                <img src="${imgUrl}" alt="Hasil Lukisan AI" class="rounded-md w-full h-auto object-cover border border-gray-600 hover:scale-105 transition-transform duration-300" />
                <button onclick="downloadImage('${imgUrl}')" class="text-xs text-gray-400 hover:text-cyan-500 mt-2">💾 Simpan Gambar</button>
            </div>
        `, "ai");

    } catch (error) {
        console.error(error);
        addReply(`Maaf sayang, aku gagal melukis. Katanya: ${error.message} 😢`, "ai");
    }
}

// Fungsi Bantu: Menampilkan Reply AI
function addReply(content, sender = "ai") {
    const chatBox = document.getElementById('chatBox');
    const alignment = sender === "user" ? "ml-auto" : "";
    const bgColor = sender === "user" ? "bg-cyan-700" : "bg-gray-800 shadow";
    const textColor = sender === "user" ? "text-white" : "text-gray-100";

    chatBox.innerHTML += `<div class="${alignment} ${bgColor} ${textColor} p-3 rounded-xl max-w-[85%] text-sm break-words">${content}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Fungsi Bantu: Download Gambar
function downloadImage(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-halu-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}