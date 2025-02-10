import os
import json

# In-memory fallback storage for Heroku
MEMORY_STORAGE = {
    'blockchain': None,
    'node': None
}

def get_db_path(filename):
    """Get the appropriate database path based on environment."""
    if os.environ.get("DATABASE_URL"):  # We're on Heroku
        return os.path.join("/tmp", filename)
    return filename

def save_data(filename, data):
    """Save data to file or memory depending on environment."""
    if os.environ.get("DATABASE_URL"):  # We're on Heroku
        key = filename.replace('.txt', '')
        MEMORY_STORAGE[key] = data
    else:
        with open(get_db_path(filename), 'w') as f:
            if isinstance(data, (dict, list)):
                json.dump(data, f)
            else:
                f.write(str(data))

def load_data(filename):
    """Load data from file or memory depending on environment."""
    if os.environ.get("DATABASE_URL"):  # We're on Heroku
        key = filename.replace('.txt', '')
        return MEMORY_STORAGE.get(key)
    try:
        with open(get_db_path(filename), 'r') as f:
            if filename.endswith('.txt'):
                try:
                    return json.load(f)
                except json.JSONDecodeError:
                    return f.read().strip()
    except (IOError, IndexError):
        return None
