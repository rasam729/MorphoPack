FROM blender:4.5

# Install Python, system deps, and compilation tools for native packages
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-pip python3-dev python3-venv git ca-certificates \
    build-essential libssl-dev libffi-dev \
    fonts-liberation ttf-dejavu xfonts-encodings xfonts-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy engine code and requirements
COPY requirements.txt /app/

# Install Python dependencies (including PDF generation tools)
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel && \
    pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Create directories for uploads and outputs
RUN mkdir -p /app/uploads /app/outputs && \
    chmod 777 /app/uploads /app/outputs

# Verify Blender installation
RUN blender --version

# Set Blender path environment variable
ENV BLENDER_PATH=/usr/bin/blender
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8

EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:5050/api/health')" || exit 1

CMD ["python3", "server.py"]
