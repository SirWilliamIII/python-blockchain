# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port 5000
EXPOSE 5000

# Environment variable for Flask
ENV FLASK_APP=app.py
ENV FLASK_ENV=development
ENV PORT=5000

# Command to run the application
CMD ["python", "app.py"] 