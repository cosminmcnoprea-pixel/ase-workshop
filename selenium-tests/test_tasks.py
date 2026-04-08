"""
Selenium UI tests for DevTask Hub — Create, Edit, Delete a task.
Runs in visible Chrome so you can watch every click in real-time.
"""

import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

APP_URL = "http://localhost:3000"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _short_pause(seconds=0.8):
    """Small sleep so you can visually follow what's happening."""
    time.sleep(seconds)


def _fill_create_form(driver, title, description="", priority="medium"):
    """Fill the 'Create New Task' form and submit."""
    wait = WebDriverWait(driver, 10)

    # Title input — first input with placeholder "Task title"
    title_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder='Task title']"))
    )
    title_input.clear()
    title_input.send_keys(title)
    _short_pause()

    # Priority select — the first <select> in the form
    selects = driver.find_elements(By.TAG_NAME, "select")
    if selects:
        Select(selects[0]).select_by_value(priority)
    _short_pause()

    # Description input
    desc_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='Description (optional)']")
    desc_input.clear()
    desc_input.send_keys(description)
    _short_pause()

    # Click "Add Task"
    add_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Add Task')]")
    add_btn.click()
    _short_pause(1.5)


def _find_task_card(driver, title, timeout=10):
    """Return the card element whose title matches."""
    wait = WebDriverWait(driver, timeout)
    # Each card title is rendered in a div with fontWeight 600 inside the card
    cards = wait.until(
        EC.presence_of_all_elements_located((By.XPATH, f"//div[contains(text(), '{title}')]"))
    )
    for card_title_el in cards:
        # Walk up to the card container
        card = card_title_el.find_element(By.XPATH, "./ancestor::div[contains(@style,'border-radius')]")
        if card:
            return card
    raise AssertionError(f"Task card with title '{title}' not found")


# ---------------------------------------------------------------------------
# Tests — executed in order via pytest-ordering or alphabetical naming
# ---------------------------------------------------------------------------

class TestTaskWorkflow:
    """Tests run sequentially: create → edit → delete."""

    def test_01_create_task(self, driver):
        """Create a new task and verify it appears in the list."""
        driver.get(APP_URL)
        _short_pause(1)

        _fill_create_form(
            driver,
            title="Selenium Test Task",
            description="Created by Selenium automation",
            priority="high",
        )

        # Verify the task appears
        card = _find_task_card(driver, "Selenium Test Task")
        assert card is not None, "Newly created task card should be visible"

        # Verify priority badge shows "high"
        assert "high" in card.text.lower(), "Task should show 'high' priority"
        print("CREATE — Task created and visible on page.")

    def test_02_edit_task(self, driver):
        """Edit the task title, description, and priority via the modal."""
        driver.get(APP_URL)
        _short_pause(1)

        # Find the task card and click "Edit"
        card = _find_task_card(driver, "Selenium Test Task")
        edit_btn = card.find_element(By.XPATH, ".//button[contains(text(), 'Edit')]")
        edit_btn.click()
        _short_pause(1)

        wait = WebDriverWait(driver, 10)

        # The edit modal should now be open — it has inputs with current values
        modal_title_input = wait.until(
            EC.presence_of_element_located(
                (By.XPATH, "//div[contains(text(), 'Edit Task')]/following::input[@placeholder='Task title']")
            )
        )

        # Clear and type new title
        modal_title_input.clear()
        _short_pause(0.3)
        modal_title_input.send_keys("Selenium Edited Task")
        _short_pause()

        # Change description
        modal_desc_input = driver.find_element(
            By.XPATH, "//div[contains(text(), 'Edit Task')]/following::input[@placeholder='Description (optional)']"
        )
        modal_desc_input.clear()
        _short_pause(0.3)
        modal_desc_input.send_keys("Edited by Selenium automation")
        _short_pause()

        # Change priority to low
        modal_select = driver.find_element(
            By.XPATH, "//div[contains(text(), 'Edit Task')]/following::select"
        )
        Select(modal_select).select_by_value("low")
        _short_pause()

        # Click "Save Changes"
        save_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Save Changes')]")
        save_btn.click()
        _short_pause(1.5)

        # Verify updated task appears
        card = _find_task_card(driver, "Selenium Edited Task")
        assert card is not None, "Edited task should be visible"
        assert "low" in card.text.lower(), "Priority should now be 'low'"
        print("EDIT — Task edited successfully.")

    def test_03_delete_task(self, driver):
        """Delete the task and verify it disappears."""
        driver.get(APP_URL)
        _short_pause(1)

        # Find the task card and click "Delete"
        card = _find_task_card(driver, "Selenium Edited Task")
        delete_btn = card.find_element(By.XPATH, ".//button[contains(text(), 'Delete')]")
        delete_btn.click()
        _short_pause(0.5)

        # Accept the confirmation dialog
        WebDriverWait(driver, 5).until(EC.alert_is_present())
        driver.switch_to.alert.accept()
        _short_pause(1.5)

        # Verify the task is gone
        remaining = driver.find_elements(By.XPATH, "//div[contains(text(), 'Selenium Edited Task')]")
        assert len(remaining) == 0, "Deleted task should no longer appear"
        print("DELETE — Task deleted successfully.")
