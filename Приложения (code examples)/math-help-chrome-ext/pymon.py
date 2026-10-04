import docker
import psutil
import time
import requests
import json
import sys
from tabulate import tabulate
# ... (telegram_bot_send_document function remains the same)

def monitor_docker_processes(process_names, interval=60, duration=3600):
    """
    Monitors resource usage and response times for specified Docker processes,
    and displays the output in a formatted table.
    """

    client = docker.from_env()
    start_time = time.time()

    while time.time() - start_time < duration:
        # Clear the console
        print("\033c", end="")

        table_data = []
        for name in process_names:
            try:
                container = client.containers.get(name)
                container_stats = container.stats(stream=False)

                cpu_percent = calculate_cpu_percent(container_stats)
                memory_usage = container_stats['memory_stats']['usage'] / (1024 * 1024)  # in MB

                # Get overall disk usage of the server
                disk_usage = psutil.disk_usage('/').percent
                free_space = psutil.disk_usage('/').free / (1024 * 1024)  # in MB

                response_time = get_response_time(container)

                table_data.append([
                    name,
                    f"{cpu_percent:.2f}%",
                    f"{memory_usage:.2f} MB",
                    f"{disk_usage:.2f}%",
                    f"{free_space:.2f} MB",
                    f"{response_time:.2f} seconds"
                ])

            except docker.errors.NotFound:
                print(f"Container not found: {name}")
            except Exception as e:
                print(f"Error monitoring container {name}: {e}")

        # Print the table using tabulate
        print(tabulate(table_data, headers=["Container", "CPU Usage", "Memory Usage", "Disk Usage", "Free Space (Server)", "Response Time"], tablefmt="grid"))

        time.sleep(interval)



def calculate_cpu_percent(stats):
    """Calculates CPU usage percentage from Docker stats."""
    cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
    system_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
    if system_delta > 0.0:
        cpu_percent = (cpu_delta / system_delta) * stats['cpu_stats']['online_cpus'] * 100.0
    else:
        cpu_percent = 0.0
    return cpu_percent



def get_response_time(container):
    """
    Gets the response time of the container.
    Replace this with your actual logic to measure response time.
    """
    # Example: Ping the container and measure the time
    try:
        start_time = time.time()
        container.exec_run("ping -c 1 google.com")  # Replace with your actual command
        end_time = time.time()
        return end_time - start_time
    except Exception as e:
        print(f"Error getting response time: {e}")
        return 0.0


if __name__ == '__main__':
    # ... (argument handling for telegram_bot_send_document)

    # Example usage: Monitor 'my_app' and 'my_database' containers
    process_names = ['math-help-api-pg', 'math-help-api','math-help-proxy']
    monitor_docker_processes(process_names)
