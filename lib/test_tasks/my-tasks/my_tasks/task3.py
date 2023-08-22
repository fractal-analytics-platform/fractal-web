"""
My task 3
"""
from typing import Sequence
from argparse import ArgumentParser
import json

from pathlib import Path


def task3(
        *,
        input_paths: Sequence[str],
        output_path: str,
        message: str,
        myarg2: bool,
        myarg3: int,
        my_dict_arg: dict[str, str],
        ):
    """
    My task 3
    """

    with open(output_path, "w") as f:
        f.write(f"{input_paths=}\n")
        f.write(f"{output_path=}\n")
        f.write(f"{message=}\n")
        f.write(f"{myarg2=}\n")
        f.write(f"{myarg3=}\n")

    processed_dict = my_dict_arg.copy()
    processed_dict["something"] = "new"
    with (Path(output_path).parent / "out.json").open("w") as f:
        json.dump(processed_dict, f)

    return {"I did": "nothing", "at": "all"}


if __name__ == "__main__":

    # Parse `-j` and `--metadata-out` arguments
    parser = ArgumentParser()
    parser.add_argument("-j", "--json", required=True)
    parser.add_argument("--metadata-out", required=True)
    args = parser.parse_args()

    # Read parameters dictionary
    with open(args.json, "r") as f:
        task_arguments = json.load(f)

    # Run task
    metadata_update = task3(**task_arguments)

    # Write output metadata to file
    with open(args.metadata_out, "w") as fout:
        json.dump(metadata_update, fout)
