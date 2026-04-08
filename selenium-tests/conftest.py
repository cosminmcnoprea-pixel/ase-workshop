import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

APP_URL = "http://localhost:3000"


@pytest.fixture(scope="session")
def driver():
    """Launch a visible Chrome browser for the entire test session."""
    options = webdriver.ChromeOptions()
    # No headless flag — Chrome opens on screen so you can watch in real-time
    options.add_argument("--start-maximized")
    options.add_argument("--disable-search-engine-choice-screen")

    service = Service(ChromeDriverManager().install())
    drv = webdriver.Chrome(service=service, options=options)
    drv.implicitly_wait(5)

    yield drv

    drv.quit()
