#!/usr/bin/env python3
"""
watcher.py - AI Agent Antigravity Repository Watcher & Summarizer
-----------------------------------------------------------------
Memantau penambahan repositori baru di data/library-store.json.
Ketika ada repo baru, AI Agent Antigravity otomatis mengambil README riil
dari GitHub dan merangkum analisis fungsional, masalah yang dipecahkan,
serta studi kasus Before vs After secara kontekstual (tanpa template generik).
"""

import os
import sys
import json
import time
import re
import base64
import argparse
from pathlib import Path
from typing import Dict, Any, Optional, List
import urllib.request
import urllib.error

# Konfigurasi encoding terminal Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Path Configuration
ROOT_DIR = Path(__file__).resolve().parent
STORE_FILE = ROOT_DIR / "data" / "library-store.json"
AI_SUMMARIES_FILE = ROOT_DIR / "data" / "ai-summaries.json"
ENV_FILE = ROOT_DIR / ".env"

# Header User-Agent untuk request GitHub
HEADERS = {
    "User-Agent": "Antigravity-GitHub-Library-Watcher/1.0",
    "Accept": "application/vnd.github.v3+json",
}

def load_env() -> Dict[str, str]:
    """Membaca file .env jika tersedia."""
    env_vars = {}
    candidates = [
        ENV_FILE,
        ROOT_DIR.parent / "Project forecast AI" / ".env",
        ROOT_DIR.parent / "Data Engineer" / ".env",
        ROOT_DIR.parent / "Project Jadi Bisa" / "bifrost" / ".env"
    ]
    for candidate in candidates:
        if candidate.exists():
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            env_vars[k.strip()] = v.strip().strip("'\"")
            except Exception:
                pass
    return env_vars

ENV = load_env()

def get_api_key(name: str) -> Optional[str]:
    """Mencari API key dari sistem env atau .env."""
    return os.environ.get(name) or ENV.get(name)

def fetch_github_readme(owner: str, repo: str) -> str:
    """Mengambil isi README asli dari GitHub REST API atau raw URL."""
    # 1. Coba GitHub REST API
    api_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
    req = urllib.request.Request(api_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if "content" in data and data.get("encoding") == "base64":
                raw_bytes = base64.b64decode(data["content"])
                return raw_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        pass

    # 2. Fallback ke Raw User Content (main & master branch)
    for branch in ["main", "master"]:
        raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md"
        try:
            req = urllib.request.Request(raw_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=8) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception:
            continue

    return ""

def fetch_repo_structure_context(owner: str, repo: str) -> str:
    """Menginspeksi folder skills, commands, plugins dari GitHub API agar LLM mengetahui daftar riil."""
    detected = []
    candidates = ["skills", ".claude/skills", "commands", "src/commands", "plugins", "tools"]
    for sub in candidates:
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{sub}"
        req = urllib.request.Request(api_url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                items = json.loads(resp.read().decode("utf-8"))
                if isinstance(items, list) and items:
                    names = [item["name"] for item in items if isinstance(item, dict) and "name" in item]
                    detected.append(f"Folder '{sub}/': " + ", ".join(names))
        except Exception:
            continue
    if detected:
        return "STRUKTUR FUNGSI & SKILLS NYATA YANG TERDETEKSI DI REPOSITORY:\n" + "\n".join(detected)
    return ""

def clean_readme_content(content: str, max_chars: int = 12000) -> str:
    """Memotong noise badge dan memprioritaskan bab fitur, skills, dan workflow esensial."""
    lines = content.split("\n")
    cleaned_lines = []
    for line in lines:
        if re.search(r"shields\.io|badge|travis-ci|codecov|github/actions", line, re.I):
            continue
        cleaned_lines.append(line)
    text = "\n".join(cleaned_lines).strip()
    if len(text) <= max_chars:
        return text

    # Jika README panjang, prioritaskan bagian pengenalan + bab skills/commands/usage
    intro = text[:3500]
    # Cari bab kunci: What's inside, Skills, Commands, Features, Usage, Workflow
    key_sections = []
    pattern = re.compile(r"(##+\s*(?:what's inside|skills|commands|features|usage|workflow|philosophy|components|api)[\s\S]*?)(?=\n##+ |\Z)", re.I)
    matches = pattern.findall(text)
    for m in matches[:6]:
        key_sections.append(m.strip())

    if key_sections:
        combined = intro + "\n\n... [BAGIAN INTI SKILLS & FITUR] ...\n\n" + "\n\n".join(key_sections)
        return combined[:max_chars]
    return text[:max_chars]

def call_ai_agent(prompt: str) -> Optional[str]:
    """
    Menghubungi AI Agent Antigravity (Mendukung Gemini REST API, Groq, atau OpenAI format).
    """
    gemini_key = get_api_key("GEMINI_API_KEY") or get_api_key("GOOGLE_API_KEY")
    groq_key = get_api_key("GROQ_API_KEY")
    openai_key = get_api_key("OPENAI_API_KEY")

    # 1. Pilihan 1: Google Gemini API (Model Antigravity Core)
    if gemini_key:
        models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.2
                }
            }
            try:
                data_bytes = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=30) as resp:
                    res_json = json.loads(resp.read().decode("utf-8"))
                    text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                    return text
            except Exception as e:
                continue

    # 2. Pilihan 2: Groq API (Ultra-Fast LLM)
    if groq_key:
        groq_models = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"]
        for g_model in groq_models:
            url = "https://api.groq.com/openai/v1/chat/completions"
            payload = {
                "model": g_model,
                "messages": [
                    {"role": "system", "content": "You are the Antigravity AI Agent. Reply ONLY with valid JSON. Never output markdown outside the JSON."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
            try:
                data_bytes = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    url, 
                    data=data_bytes, 
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {groq_key}",
                        "User-Agent": "Mozilla/5.0"
                    }
                )
                with urllib.request.urlopen(req, timeout=40) as resp:
                    res_json = json.loads(resp.read().decode("utf-8"))
                    print(f"[*] AI Agent merespon via Groq ({g_model})")
                    return res_json["choices"][0]["message"]["content"]
            except Exception as e:
                # Coba model berikutnya jika model tidak tersedia
                continue

    # 3. Pilihan 3: OpenAI-compatible API
    if openai_key:
        base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        url = f"{base_url}/chat/completions"
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are the Antigravity AI Agent. Reply ONLY with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }
        try:
            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url, 
                data=data_bytes, 
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                return res_json["choices"][0]["message"]["content"]
        except Exception as e:
            pass

    return None

def generate_ai_summary(repo: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Menganalisis repository dan memproduksi summary murni via AI."""
    owner = repo.get("owner", "")
    name = repo.get("name", "")
    full_name = repo.get("fullName") or f"{owner}/{repo.get('name')}"
    desc = repo.get("description", "")
    lang = repo.get("primaryLanguage", "Unknown")
    topics = repo.get("topics", [])

    print(f"[*] Mengambil README riil dari https://github.com/{full_name}...")
    readme_raw = fetch_github_readme(owner, name)
    readme_excerpt = clean_readme_content(readme_raw, 12000)
    repo_structure = fetch_repo_structure_context(owner, name)

    prompt = f"""
Anda adalah "AI Agent Antigravity" untuk platform GitHub Library Hub.
Tugas Anda adalah membedah repositori open-source berikut berdasarkan README asli, tujuan teknis, dan arsitekturnya, lalu menghasilkan ringkasan mendalam yang 100% otentik dan bebas dari template generik.

INFORMASI REPOSITORI:
- Full Name: {full_name}
- Bahasa Utama: {lang}
- Deskripsi: {desc}
- Topik/Tags: {', '.join(topics) if isinstance(topics, list) else topics}

KONTEN README ASLI (Kutipan):
\"\"\"
{readme_excerpt}
\"\"\"

INSTRUKSI OUTPUT:
Hasilkan HANYA objek JSON valid (tanpa markdown backtick atau teks pembuka) dengan skema berikut:

{{
  "corePurpose": "Penjelasan presisi 2-3 kalimat dalam Bahasa Indonesia mengenai apa masalah mendasar yang diselesaikan oleh proyek ini dan arsitektur intinya.",
  "problemsSolved": [
    {{
      "title": "Nama Masalah Konkret 1",
      "description": "Penjelasan mengapa ini menjadi masalah bagi developer dan bagaimana solusi repo ini mengatasinya."
    }},
    {{
      "title": "Nama Masalah Konkret 2",
      "description": "Penjelasan detail..."
    }},
    {{
      "title": "Nama Masalah Konkret 3",
      "description": "Penjelasan detail..."
    }}
  ],
  "ladderRules": [
    "Prinsip atau metodologi inti 1 yang diterapkan",
    "Prinsip atau metodologi inti 2 yang diterapkan",
    "Prinsip atau metodologi inti 3 yang diterapkan"
  ],
  "useCases": [
    "Kapan developer harus menggunakan repo ini (Kasus 1)",
    "Kapan developer harus menggunakan repo ini (Kasus 2)",
    "Kapan developer harus menggunakan repo ini (Kasus 3)"
  ],
  "cases": [
    {{
      "id": "case1",
      "name": "1. [Nama Studi Kasus Utama yang Relevan dengan Repo Ini]",
      "prompt": "\\\"[Contoh prompt nyata yang diketik developer saat ingin memanfaatkan repositori ini]\\\"",
      "scenarioType": "automation | engine | data | security | ui | efficiency | backend",
      "scenarioBadge": "[Emoji & Label Skenario, contoh: '⚡ Code Intelligence & Blast Radius' atau '🤖 Autonomous Web Agent']",
      "beforeTitle": "BEFORE ([Kondisi sebelum ada repositori ini / pendekatan konvensional])",
      "beforeMeta": "[Ringkasan kelemahan before, misal: Brute-force file scan • Boros 3.000 tokens]",
      "beforeCode": "[Contoh kode atau alur kerja lama yang lambat, rapuh, atau tidak aman]",
      "beforeHtml": null,
      "beforeNotes": [
        {{ "label": "Kelemahan", "value": "[Kelemahan cara lama]" }},
        {{ "label": "Beban", "value": "[Beban/biaya cara lama]" }}
      ],
      "afterTitle": "AFTER (Dengan {name})",
      "afterMeta": "[Ringkasan keunggulan after, misal: Persistent graph mapping • Hemat 75% tokens]",
      "afterCode": "[Contoh kode atau perintah CLI nyata yang menggunakan {name}]",
      "afterHtml": null,
      "afterNotes": [
        {{ "label": "Keunggulan", "value": "[Solusi nyata {name}]" }},
        {{ "label": "Hasil", "value": "[Hasil yang didapatkan]" }}
      ],
      "ruleBadge": "[Teknologi/prinsip inti repo ini]",
      "metrics": [
        {{ "label": "[Label Metrik 1, misal: Akurasi / Throughput / Token]", "value": "[Nilai 1]", "color": "emerald" }},
        {{ "label": "[Label Metrik 2, misal: Latensi / Resiliensi / Efisiensi]", "value": "[Nilai 2]", "color": "sky" }},
        {{ "label": "[Label Metrik 3, misal: Integrasi / Format / Protokol]", "value": "[Nilai 3]", "color": "amber" }}
      ]
    }}
  ],
  "_comment_ui_rule": "ATURAN MUTLAK VISUAL UI: Field beforeHtml dan afterHtml HANYA boleh dihasilkan jika repositori berfokus murni pada Frontend Web UI (scenarioType == 'ui'). Untuk CLI, backend, framework SDLC, devtools, metodologi, dan engine (scenarioType != 'ui'), DILARANG KERAS membuat beforeHtml/afterHtml (isi null atau hilangkan); wajib gunakan beforeCode dan afterCode berupa teks/script/command dinamis!",
  "howToUse": [
    {{
      "step": 1,
      "title": "[Langkah 1: Instalasi / Setup]",
      "command": "[Perintah terminal untuk instalasi, misal: pip install ... atau npm install ...]",
      "description": "[Penjelasan langkah instalasi atau dependensi]"
    }},
    {{
      "step": 2,
      "title": "[Langkah 2: Konfigurasi / Inisialisasi]",
      "command": "[Perintah inisialisasi atau setup config]",
      "description": "[Penjelasan konfigurasi atau env setup]"
    }},
    {{
      "step": 3,
      "title": "[Langkah 3: Eksekusi / Penggunaan]",
      "command": "[Perintah terminal untuk menjalankan fitur utama]",
      "description": "[Penjelasan cara menjalankan atau memanggil]"
    }}
  ],
  "commands": [
    {{
      "command": "[Nama Command / Slash Command / Sub-command / Skill]",
      "function": "[Fungsi dan penjelasan detail peran perintah ini]",
      "example": "[Contoh pemanggilan nyata di terminal atau chat prompt]"
    }}
  ],
  "_comment_commands": "ATURAN MUTLAK DAFTAR COMMANDS: DILARANG HANYA MENULIS PERINTAH INSTALASI (seperti pip install, agy plugin install). Perintah instalasi ditaruh di howToUse! Bagian commands WAJIB mendaftar SELURUH skill, slash-command, sub-command, atau CLI tools yang ada di repo secara komprehensif (jika ada 10-15 skills, cantumkan SELURUHNYA tanpa dipotong)!",
  "cloneCommand": "git clone https://github.com/{full_name}.git"
}}
"""

    raw_response = call_ai_agent(prompt)
    if not raw_response:
        print("[!] Tidak ada API Key LLM yang aktif (GEMINI_API_KEY / GROQ_API_KEY / OPENAI_API_KEY).")
        return None

    # Bersihkan markdown code block jika model membungkusnya dalam ```json ... ```
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_response.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())

    try:
        parsed = json.loads(cleaned)
        # SANITASI KETAT: Jika skenario bukan 'ui', hapus beforeHtml & afterHtml agar murni teks dinamis
        if isinstance(parsed, dict) and "cases" in parsed and isinstance(parsed["cases"], list):
            for case in parsed["cases"]:
                if isinstance(case, dict) and case.get("scenarioType") != "ui":
                    case.pop("beforeHtml", None)
                    case.pop("afterHtml", None)
        return parsed
    except json.JSONDecodeError as err:
        print(f"[!] Gagal parsing JSON dari respons AI: {err}")
        return None

def load_ai_summaries() -> Dict[str, Any]:
    """Membaca cache data/ai-summaries.json."""
    if AI_SUMMARIES_FILE.exists():
        try:
            with open(AI_SUMMARIES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_ai_summaries(data: Dict[str, Any]) -> None:
    """Menyimpan data/ai-summaries.json ke disk."""
    AI_SUMMARIES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(AI_SUMMARIES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[OK] Berhasil menyimpan pembaruan ke {AI_SUMMARIES_FILE.relative_to(ROOT_DIR)}")

def process_single_repo(repo: Dict[str, Any], summaries: Dict[str, Any]) -> bool:
    """Memproses satu repository dan memperbarui data summary."""
    full_name = (repo.get("fullName") or f"{repo.get('owner')}/{repo.get('name')}").lower()
    if not full_name or "/" not in full_name:
        return False

    print(f"\n=======================================================")
    print(f"[AI AGENT ANTIGRAVITY] Menganalisis: {full_name}")
    print(f"=======================================================")

    summary = generate_ai_summary(repo)
    if summary:
        summaries[full_name] = summary
        save_ai_summaries(summaries)
        print(f"[OK] Selesai: Summary AI untuk {full_name} berhasil dibuat!")
        return True
    else:
        print(f"[x] Gagal menghasilkan AI summary untuk {full_name}")
        return False

def check_and_process(force_all: bool = False, specific_repo: Optional[str] = None):
    """Mengecek library-store.json dan memproses repo baru."""
    if not STORE_FILE.exists():
        print(f"[!] File store {STORE_FILE} belum tersedia.")
        return

    try:
        with open(STORE_FILE, "r", encoding="utf-8") as f:
            store = json.load(f)
    except Exception as e:
        print(f"[!] Gagal membaca store: {e}")
        return

    repos: List[Dict[str, Any]] = store.get("repositories", [])
    summaries = load_ai_summaries()

    processed_count = 0
    for repo in repos:
        full_name = (repo.get("fullName") or f"{repo.get('owner')}/{repo.get('name')}").lower()
        
        if specific_repo and full_name != specific_repo.lower():
            continue

        # Cek apakah sudah pernah diringkas oleh AI Agent
        if not force_all and full_name in summaries:
            continue

        success = process_single_repo(repo, summaries)
        if success:
            processed_count += 1

    if processed_count == 0 and specific_repo is None:
        print(f"[*] Semua repositori ({len(repos)} repo) sudah memiliki AI summary.")

def run_watcher_loop(interval: int = 4):
    """Loop pemantau background yang reaktif terhadap perubahan data/library-store.json."""
    print("=================================================================")
    print("🚀 Antigravity AI Agent Watcher Daemon Aktif")
    print(f"📁 Memantau: {STORE_FILE.relative_to(ROOT_DIR)}")
    print(f"⏱️ Interval: Setiap {interval} detik")
    print("Tekan Ctrl+C untuk menghentikan.")
    print("=================================================================")

    last_mtime = 0
    while True:
        try:
            if STORE_FILE.exists():
                current_mtime = os.path.getmtime(STORE_FILE)
                if current_mtime != last_mtime:
                    last_mtime = current_mtime
                    print(f"\n[!] Deteksi perubahan pada {STORE_FILE.name} ({time.strftime('%H:%M:%S')})")
                    check_and_process(force_all=False)
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\n[!] Watcher daemon dihentikan.")
            break
        except Exception as e:
            print(f"[!] Terjadi kesalahan pada loop watcher: {e}")
            time.sleep(interval)

def main():
    parser = argparse.ArgumentParser(description="Antigravity AI Agent Repo Watcher & Summarizer")
    parser.add_argument("--repo", type=str, help="Proses repositori spesifik (contoh: tirth8205/code-review-graph)")
    parser.add_argument("--process-all", action="store_true", help="Proses ulang seluruh repositori yang ada di library-store.json")
    parser.add_argument("--once", action="store_true", help="Jalankan pemeriksaan satu kali saja lalu keluar (tanpa daemon loop)")
    parser.add_argument("--interval", type=int, default=4, help="Interval loop dalam detik (default: 4)")

    args = parser.parse_args()

    if args.repo:
        check_and_process(force_all=True, specific_repo=args.repo)
    elif args.process_all:
        check_and_process(force_all=True)
    elif args.once:
        check_and_process(force_all=False)
    else:
        run_watcher_loop(interval=args.interval)

if __name__ == "__main__":
    main()
