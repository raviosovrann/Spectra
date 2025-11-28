#!/bin/bash
# TimesFM ML Service Setup and Start Script
# Usage:
#   ./setup.sh          - Setup only (first time)
#   ./setup.sh start    - Start in development mode
#   ./setup.sh prod     - Start in production mode (gunicorn)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT=${ML_SERVICE_PORT:-5001}

# Function to setup the environment
setup() {
    echo "🚀 Setting up TimesFM ML Service..."

    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is required but not installed."
        exit 1
    fi

    PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    echo "📦 Found Python $PYTHON_VERSION"

    # Create virtual environment
    if [ ! -d "venv" ]; then
        echo "📦 Creating virtual environment..."
        python3 -m venv venv
    fi

    source venv/bin/activate

    echo "📦 Upgrading pip..."
    pip install --upgrade pip

    echo "📦 Installing dependencies..."
    pip install -r requirements.txt

    # Install TimesFM
    if ! python -c "import timesfm" 2>/dev/null; then
        echo "📦 Installing TimesFM..."
        if [ ! -d "timesfm" ]; then
            git clone https://github.com/google-research/timesfm.git
        fi
        cd timesfm
        pip install -e .
        cd ..
    fi

    mkdir -p models

    # Download model
    echo "📥 Downloading TimesFM model (this may take a while)..."
    python -c "
import timesfm
print('Loading TimesFM model...')
model = timesfm.TimesFM_2p5_200M_torch.from_pretrained('google/timesfm-2.5-200m-pytorch')
print('✅ Model downloaded and cached successfully!')
"

    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "To start the service:"
    echo "  ./setup.sh start   - Development mode"
    echo "  ./setup.sh prod    - Production mode (gunicorn)"
}

# Function to start in development mode
start_dev() {
    if [ ! -d "venv" ]; then
        echo "❌ Run ./setup.sh first to set up the environment."
        exit 1
    fi
    source venv/bin/activate
    echo "🔧 Starting ML service in DEVELOPMENT mode on port $PORT..."
    python server.py
}

# Function to start in production mode
start_prod() {
    if [ ! -d "venv" ]; then
        echo "❌ Run ./setup.sh first to set up the environment."
        exit 1
    fi
    source venv/bin/activate
    echo "🚀 Starting ML service in PRODUCTION mode on port $PORT..."
    exec gunicorn -w 1 -b 0.0.0.0:$PORT --timeout 120 server:app
}

# Main
case "${1:-}" in
    start)
        start_dev
        ;;
    prod|production)
        start_prod
        ;;
    *)
        setup
        ;;
esac
