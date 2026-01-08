import streamlit as st
import pandas as pd
import networkx as nx
from pyvis.network import Network
import os

DATA_DIR = 'data'

st.title('User-File-Device Graph: At-Risk Nodes and Their Connections')

# Load data
def load_data():
    file_access = pd.read_csv(os.path.join(DATA_DIR, 'file_access.csv'), parse_dates=['access_time'])
    usb_usage = pd.read_csv(os.path.join(DATA_DIR, 'usb_usage.csv'), parse_dates=['plug_time', 'unplug_time'])
    scores = pd.read_csv(os.path.join(DATA_DIR, 'anomaly_scores.csv'))
    return file_access, usb_usage, scores

file_access, usb_usage, scores = load_data()

# Build full graph
G = nx.Graph()
for _, row in file_access.iterrows():
    G.add_edge(row['user'], row['file'], type='access')
for _, row in usb_usage.iterrows():
    G.add_edge(row['user'], row['device'], type='usb')

# Prepare node attributes
def get_node_attrs():
    attrs = {}
    for _, row in scores.iterrows():
        anomaly = max(row['isolation_forest'], row['oneclass_svm'], row['autoencoder'])
        red_team = row['is_red_team']
        attrs[row['user']] = {
            'anomaly': anomaly,
            'red_team': red_team,
            'high_risk': (anomaly > 1.0) or (red_team == 1)
        }
    return attrs

attrs = get_node_attrs()

# Find at-risk nodes (users)
high_risk_nodes = {n for n, v in attrs.items() if v['high_risk']}

# Find all neighbors of at-risk nodes
connected_nodes = set()
for node in high_risk_nodes:
    connected_nodes.add(node)
    connected_nodes.update(G.neighbors(node))

# Induce subgraph
subG = G.subgraph(connected_nodes).copy()

# Create PyVis network with stable, slow physics
net = Network(height='1000px', width='100%', notebook=False, bgcolor='#222222', font_color='white')
net.barnes_hut(gravity=-2000, central_gravity=0.1, spring_length=200, spring_strength=0.01, damping=0.85, overlap=1)
net.set_options('''
var options = {
  "physics": {
    "enabled": true,
    "stabilization": {"enabled": true, "fit": true, "iterations": 2500, "updateInterval": 50},
    "barnesHut": {
      "gravitationalConstant": -2000,
      "centralGravity": 0.1,
      "springLength": 200,
      "springConstant": 0.01,
      "damping": 0.85,
      "avoidOverlap": 1
    }
  }
}
''')

for node in subG.nodes():
    if node in attrs:
        score = attrs[node]['anomaly']
        red = attrs[node]['red_team']
        color = 'red' if red else ('orange' if score > 1.5 else 'yellow' if score > 1.0 else 'lightblue')
        size = 30 if red else (20 if score > 1.5 else 15 if score > 1.0 else 10)
        title = f"User: {node}<br>Anomaly Score: {score:.2f}<br>Red Team: {'Yes' if red else 'No'}"
    elif str(node).startswith('file'):
        color = 'green'
        size = 8
        title = f"File: {node}"
    elif str(node).startswith('usb'):
        color = 'purple'
        size = 8
        title = f"Device: {node}"
    else:
        color = 'gray'
        size = 8
        title = str(node)
    net.add_node(node, label=str(node), color=color, size=size, title=title)

for edge in subG.edges(data=True):
    net.add_edge(edge[0], edge[1], color='gray' if edge[2]['type']=='access' else 'purple')

# Save and display
net.save_graph('dashboard/graph.html')
st.components.v1.html(open('dashboard/graph.html', 'r', encoding='utf-8').read(), height=1000, scrolling=False) 