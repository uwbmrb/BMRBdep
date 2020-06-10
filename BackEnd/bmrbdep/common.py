#!/usr/bin/env python3
import logging
import os
import sqlite3
import zlib
from typing import Union, TextIO

import simplejson as json
import werkzeug.utils

from bmrbdep.exceptions import ServerError, RequestError

root_dir: str = os.path.dirname(os.path.realpath(__file__))
configuration: dict = json.loads(open(os.path.join(root_dir, 'configuration.json'), "r").read())

residue_mappings = {'polypeptide(L)': {'P': 'PRO', 'G': 'GLY', 'A': 'ALA', 'R': 'ARG', 'N': 'ASN',
                                       'D': 'ASP', 'C': 'CYS', 'Q': 'GLN', 'E': 'GLU', 'H': 'HIS',
                                       'I': 'ILE', 'L': 'LEU', 'K': 'LYS', 'M': 'MET', 'F': 'PHE',
                                       'S': 'SER', 'T': 'THR', 'W': 'TRP', 'Y': 'TYR', 'V': 'VAL',
                                       'U': 'SEC'},
                    'polyribonucleotide': {'A': 'A', 'C': 'C', 'G': 'G', 'T': 'T', 'U': 'U'},
                    'polydeoxyribonucleotide': {'A': 'DA', 'C': 'DC', 'G': 'DG', 'T': 'DT', 'U': 'DU'}}


def get_schema(version: str, schema_format: str = "json") -> Union[dict, TextIO]:
    """ Return the schema from disk. """

    # When running locally
    schema_dir = os.path.join(root_dir, '..', 'schema', 'schema_data')
    if not os.path.exists(schema_dir):
        schema_dir = os.path.join(root_dir, '..', 'schema_data')
        if not os.path.exists(schema_dir):
            raise IOError("No schema directory found: %s" % schema_dir)

    try:
        if schema_format == "json":
            with open(os.path.join(schema_dir, version + '.json.zlib'), 'rb') as schema_file:
                schema = json.loads(zlib.decompress(schema_file.read()).decode())
        elif schema_format == "xml":
            return open(os.path.join(schema_dir, version + '.xml'), 'r')
        else:
            raise ServerError('Attempted to load invalid schema type.')
    except IOError:
        raise RequestError("Invalid schema version.")

    return schema


def get_release():
    """ Returns the git branch and last commit that were present during the last release. """

    return open(os.path.join(root_dir, 'version.txt'), 'r').read().strip()


def secure_filename(filename: str) -> str:
    """ Wraps werkzeug secure_filename but raises an error if the filename comes out empty. """

    filename = werkzeug.utils.secure_filename(filename)
    if not filename:
        raise RequestError('Invalid upload file name. Please rename the file and try again.')
    return filename


def create_db_if_needed():
    """ Creates the entry DB if needed. """

    database_path = os.path.join(configuration['repo_path'], 'depositions.sqlite3')
    if not os.path.exists(database_path):
        with sqlite3.connect(os.path.join(configuration['repo_path'], 'depositions.sqlite3')) as conn:
            cur = conn.cursor()
            cur.execute("""
CREATE TABLE entrylog (bmrbig_id INTEGER PRIMARY KEY AUTOINCREMENT,
                       restart_id TEXT UNIQUE,
                       author_email TEXT,
                       submission_date DATE,
                       release_date DATE,
                       contact_person1 TEXT,
                       title TEXT,
                       bmrb_id TEXT,
                       pdb_id TEXT,
                       publication_doi TEXT
                       );""")
            cur.execute("CREATE INDEX restart_ids on entrylog (restart_id);")
            conn.commit()


def update_entire_database():
    """ Updates all records in the database. """

    pass
