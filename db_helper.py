import os


def get_db_path(filename):
    """Get the appropriate database path based on environment."""
    if os.environ.get("DATABASE_URL"):  # We're on Heroku
        return os.path.join("/tmp", filename)
    return filename  # Local development
