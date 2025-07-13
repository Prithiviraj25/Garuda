import streamlit as st
import requests
import json

st.set_page_config(page_title="BCM Threat Intelligence Dashboard", layout="wide")

API_URL = "http://localhost:8000"  # Update this if deployed elsewhere

st.title("🛡️ Business Continuity Management Dashboard")

# Sidebar for input
st.sidebar.header("Query IOC")
query = st.sidebar.text_input("Enter keyword or threat type:", "phishing")

if st.sidebar.button("Search IOCs"):
    with st.spinner("Searching IOCs from Pinecone..."):
        resp = requests.post(f"{API_URL}/search-iocs", json={"query": query})
        if resp.status_code == 200:
            matches = resp.json()["matches"]
            st.subheader(f"🔍 Results for: {query}")
            for m in matches:
                md = m["metadata"]
                with st.expander(f"{md.get('type')} | {md.get('value')}"):
                    st.write(md)
                    st.write(f"Score: {round(m['score'], 2)}")
        else:
            st.error("Failed to fetch IOCs")

# BCM Dashboard
st.header("📊 BCM Summary Dashboard")
if st.button("Run BCM Analysis"):
    with st.spinner("Evaluating BCM impact from Pinecone data..."):
        resp = requests.get(f"{API_URL}/bcm-dashboard")
        if resp.status_code == 200:
            results = resp.json()["bcm_results"]
            for r in results:
                with st.expander(f"IOC: {r['ioc_id']} | Score: {round(r['score'], 2)}"):
                    st.markdown(f"""
                    **BCM Summary**:

                    ```
                    {r['bcm_summary']}
                    ```
                    """)
        else:
            st.error("Failed to retrieve BCM dashboard")

# IOC Analyzer
st.header("🧠 Analyze Individual IOC")
ioc = st.text_input("IOC Value", "192.168.1.1")
ioc_type = st.selectbox("IOC Type", ["ip", "domain", "url", "hash"])
severity = st.selectbox("Severity", ["low", "medium", "high"])
sector = st.text_input("Client Sector", "Finance")

if st.button("Analyze IOC"):
    with st.spinner("Running analysis using LLM..."):
        payload = {
            "ioc": ioc,
            "ioc_type": ioc_type,
            "severity": severity,
            "sector": sector
        }
        resp = requests.post(f"{API_URL}/bcm-impact", json=payload)
        if resp.status_code == 200:
            r = resp.json()
            st.success("Analysis Complete")
            st.markdown(f"""
            ```
            {r['response']}
            ```
            """)
        else:
            st.error("Failed to analyze IOC")