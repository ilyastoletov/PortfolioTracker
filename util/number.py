def is_float(v) -> bool:
    try:
        float(v)
        return True
    except Exception:
        return False