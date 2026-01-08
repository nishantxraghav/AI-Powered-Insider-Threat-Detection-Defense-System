import pandas as pd
import networkx as nx
import os

DATA_DIR = 'data'

# Load logs
def load_logs():
    file_access = pd.read_csv(os.path.join(DATA_DIR, 'file_access.csv'), parse_dates=['access_time'])
    usb_usage = pd.read_csv(os.path.join(DATA_DIR, 'usb_usage.csv'), parse_dates=['plug_time', 'unplug_time'])
    return file_access, usb_usage

file_access, usb_usage = load_logs()

# Build bipartite graph: users <-> files, users <-> devices
G = nx.Graph()
for _, row in file_access.iterrows():
    G.add_edge(row['user'], row['file'], type='access')
for _, row in usb_usage.iterrows():
    G.add_edge(row['user'], row['device'], type='usb')

# Compute simple graph features (degree, centrality)
user_nodes = [n for n in G.nodes if n.startswith('user')]
degrees = nx.degree_centrality(G)
betweenness = nx.betweenness_centrality(G)

features = []
for user in user_nodes:
    features.append({
        'user': user,
        'degree_centrality': degrees[user],
        'betweenness_centrality': betweenness[user]
    })
pd.DataFrame(features).to_csv(os.path.join(DATA_DIR, 'graph_features.csv'), index=False)
print('Graph features saved to data/graph_features.csv')

# Placeholder: GNN anomaly detection (PyTorch Geometric, not implemented)
print('GNN anomaly detection scaffold ready. (Implement with PyTorch Geometric for full GNN)') 