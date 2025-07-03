import logging
import sys


def setup_logger():
    logger = logging.getLogger("app_logger")
    logger.setLevel(logging.DEBUG)

    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


logger = setup_logger()
