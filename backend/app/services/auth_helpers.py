def split_full_name(full_name: str) -> tuple[str, str | None, str]:
    """
    Splits a full name string into (first_name, middle_name, last_name).
    """
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], None, ""
    elif len(parts) == 2:
        return parts[0], None, parts[1]
    else:
        return parts[0], " ".join(parts[1:-1]), parts[-1]
