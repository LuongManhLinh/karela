from datetime import datetime
import os


def log(
    connection_id: str,
    project_key: str,
    file_name: str = "info.log",
    tag: str = "INFO",
    message: str = "",
    log_cs: bool = True,
):
    with open(f".workspace/{connection_id}/{project_key}/logs/{file_name}", "a") as f:
        # Get the current timestamp in format YYYY-MM-DD HH:MM:SS
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        msg = f"{timestamp} [{tag}] {message}\n"
        f.write(msg)
        if log_cs:
            print(msg)


class Logger:
    def __init__(
        self, connection_id: str, project_key: str, file_name: str = "info.log"
    ):
        self.connection_id = connection_id
        self.project_key = project_key
        self.file_name = file_name

    def info(self, message: str, log_cs: bool = True):
        log(
            connection_id=self.connection_id,
            project_key=self.project_key,
            file_name=self.file_name,
            tag="INFO",
            message=message,
            log_cs=log_cs,
        )

    def error(self, message: str, log_cs: bool = True):
        log(
            connection_id=self.connection_id,
            project_key=self.project_key,
            file_name=self.file_name,
            tag="ERROR",
            message=message,
            log_cs=log_cs,
        )

    def debug(self, message: str, log_cs: bool = True):
        log(
            connection_id=self.connection_id,
            project_key=self.project_key,
            file_name=self.file_name,
            tag="DEBUG",
            message=message,
            log_cs=log_cs,
        )

    def warning(self, message: str, log_cs: bool = True):
        log(
            connection_id=self.connection_id,
            project_key=self.project_key,
            file_name=self.file_name,
            tag="WARNING",
            message=message,
            log_cs=log_cs,
        )

    def log(self, tag: str, message: str, log_cs: bool = True):
        log(
            connection_id=self.connection_id,
            project_key=self.project_key,
            file_name=self.file_name,
            tag=tag,
            message=message,
            log_cs=log_cs,
        )

    @staticmethod
    def default():
        os.makedirs(".workspace/sudo/default/logs", exist_ok=True)
        return Logger(connection_id="sudo", project_key="default", file_name="info.log")
