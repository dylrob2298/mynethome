import json


def remove_all_duplicates(parts):
    """
    Removes all duplicate terms in a list of strings, considering
    singular and plural terms as duplicates.
    
    Args:
        parts (list[str]): List of terms to deduplicate.
    Returns:
        list[str]: Deduplicated list of terms.
    """
    seen = set()
    deduplicated = []
    for part in parts:
        normalized = part.rstrip("s")  # Remove trailing 's' for comparison
        if normalized not in seen:
            seen.add(normalized)
            deduplicated.append(part)
    return deduplicated


def shorten_operation_id(operation_id, style="camel"):
    """
    Simplify the operationId while maintaining clarity.
    
    Args:
        operation_id (str): Original operationId.
        style (str): Style of the output. Options: "camel", "snake".
    Returns:
        str: Shortened and formatted operationId.
    """
    parts = operation_id.split("_")
    meaningful_parts = remove_all_duplicates(parts)  # Remove all duplicates

    if style == "camel":
        # Capitalize meaningful parts
        return "".join(part.capitalize() for part in meaningful_parts)
    elif style == "snake":
        # Join meaningful parts with underscores
        return "_".join(meaningful_parts).lower()
    else:
        raise ValueError("Invalid style. Use 'camel' or 'snake'.")


def update_operation_ids(openapi_data, style="camel"):
    """
    Update the operationId fields in the OpenAPI JSON to use shorter, more meaningful names.
    
    Args:
        openapi_data (dict): OpenAPI specification.
        style (str): Style of the output. Options: "camel", "snake".
    Returns:
        dict: Updated OpenAPI specification.
    """
    for path, methods in openapi_data.get("paths", {}).items():
        for method, details in methods.items():
            if "operationId" in details:
                original_id = details["operationId"]
                new_id = shorten_operation_id(original_id, style=style)
                print(f"Updating operationId: {original_id} -> {new_id}")
                details["operationId"] = new_id

    return openapi_data


def main():
    input_file = "openapi.json"
    output_file = "openapi_shortened.json"
    style = "snake"  # Change to "snake" for snake_case

    # Load the OpenAPI spec
    with open(input_file, "r") as f:
        openapi_data = json.load(f)

    # Update operation IDs
    updated_data = update_operation_ids(openapi_data, style=style)

    # Save the updated spec
    with open(output_file, "w") as f:
        json.dump(updated_data, f, indent=2)

    print(f"Updated OpenAPI spec saved to {output_file}")


if __name__ == "__main__":
    main()
