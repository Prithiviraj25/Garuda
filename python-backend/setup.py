#!/usr/bin/env python3
import os
import subprocess
import sys

def create_venv():
    """Create a Python virtual environment"""
    print("Creating Python virtual environment...")
    subprocess.run([sys.executable, "-m", "venv", "bcm_env"], check=True)
    print("✅ Virtual environment created successfully!")

def install_requirements():
    """Install requirements in the virtual environment"""
    print("Installing requirements...")
    venv_python = os.path.join("bcm_env", "Scripts", "python.exe") if os.name == "nt" else os.path.join("bcm_env", "bin", "python")
    subprocess.run([venv_python, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    print("✅ Requirements installed successfully!")

def create_env_file():
    """Create environment file with example values"""
    env_content = """# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=your_pinecone_index_name
PINECONE_NAMESPACE=your_namespace

# GROQ Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192

# FastAPI Configuration
FASTAPI_HOST=localhost
FASTAPI_PORT=8000
"""
    with open(".env", "w") as f:
        f.write(env_content)
    print("✅ Environment file created! Please update .env with your API keys.")

def main():
    print("🚀 Setting up BCM Analysis Backend...")
    
    try:
        create_venv()
        install_requirements()
        create_env_file()
        
        print("\n" + "="*50)
        print("🎉 Setup Complete!")
        print("="*50)
        print("Next steps:")
        print("1. Update the .env file with your API keys")
        print("2. Activate the virtual environment:")
        print("   - Windows: .\\bcm_env\\Scripts\\activate")
        print("   - macOS/Linux: source bcm_env/bin/activate")
        print("3. Start the backend: python main.py")
        print("="*50)
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 